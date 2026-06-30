import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../dashboard/screens/dashboard_screen.dart';
import '../../fuel/screens/fuel_screen.dart';
import '../../service_logs/screens/services_screen.dart';
import '../../expenses/screens/expenses_screen.dart';
import '../../stats/screens/stats_screen.dart';
import '../../bikes/providers/bikes_provider.dart';
import '../../../core/theme/app_colors.dart';
import '../../../shared/widgets/bike_selector_sheet.dart';

class MainScreen extends ConsumerStatefulWidget {
  const MainScreen({super.key});

  @override
  ConsumerState<MainScreen> createState() => _MainScreenState();
}

class _MainScreenState extends ConsumerState<MainScreen> {
  int _currentIndex = 0;

  final List<Widget> _screens = const [
    DashboardScreen(),
    FuelScreen(),
    ServicesScreen(),
    ExpensesScreen(),
    StatsScreen(),
  ];

  final List<_NavItem> _navItems = const [
    _NavItem(
      label: 'Dashboard',
      icon: Icons.dashboard_outlined,
      activeIcon: Icons.dashboard,
    ),
    _NavItem(
      label: 'Fuel',
      icon: Icons.local_gas_station_outlined,
      activeIcon: Icons.local_gas_station,
    ),
    _NavItem(
      label: 'Service',
      icon: Icons.build_outlined,
      activeIcon: Icons.build,
    ),
    _NavItem(
      label: 'Expenses',
      icon: Icons.receipt_outlined,
      activeIcon: Icons.receipt,
    ),
    _NavItem(
      label: 'Stats',
      icon: Icons.bar_chart_outlined,
      activeIcon: Icons.bar_chart,
    ),
  ];

  String get _currentTitle => _navItems[_currentIndex].label;

  @override
  Widget build(BuildContext context) {
    final activeBikeAsync = ref.watch(activeBikeProvider);
    final bikeName = activeBikeAsync.whenOrNull(
      data: (bike) => bike?.name,
    );

    return Scaffold(
      appBar: AppBar(
        title: Text(_currentTitle),
        centerTitle: false,
        actions: [
          // Bike selector in app bar
          GestureDetector(
            onTap: () {
              showModalBottomSheet(
                context: context,
                isScrollControlled: true,
                shape: const RoundedRectangleBorder(
                  borderRadius:
                      BorderRadius.vertical(top: Radius.circular(20)),
                ),
                builder: (_) => const BikeSelectorSheet(),
              );
            },
            child: Container(
              margin: const EdgeInsets.only(right: 8),
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
              decoration: BoxDecoration(
                color: AppColors.primary.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(
                    color: AppColors.primary.withValues(alpha: 0.3)),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(Icons.motorcycle,
                      size: 16, color: AppColors.primary),
                  const SizedBox(width: 4),
                  Text(
                    bikeName ?? 'Select Bike',
                    style: const TextStyle(
                      color: AppColors.primary,
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(width: 2),
                  const Icon(Icons.expand_more,
                      size: 14, color: AppColors.primary),
                ],
              ),
            ),
          ),
          // Popup menu for Bikes management
          PopupMenuButton<String>(
            onSelected: (value) {
              if (value == 'bikes') {
                context.push('/bikes');
              }
            },
            itemBuilder: (ctx) => const [
              PopupMenuItem(
                value: 'bikes',
                child: Row(
                  children: [
                    Icon(Icons.motorcycle, size: 18),
                    SizedBox(width: 8),
                    Text('Manage Bikes'),
                  ],
                ),
              ),
            ],
            icon: const Icon(Icons.more_vert),
          ),
        ],
      ),
      body: IndexedStack(
        index: _currentIndex,
        children: _screens,
      ),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentIndex,
        onTap: (index) => setState(() => _currentIndex = index),
        items: _navItems
            .map((item) => BottomNavigationBarItem(
                  icon: Icon(item.icon),
                  activeIcon: Icon(item.activeIcon),
                  label: item.label,
                ))
            .toList(),
      ),
    );
  }
}

class _NavItem {
  final String label;
  final IconData icon;
  final IconData activeIcon;

  const _NavItem({
    required this.label,
    required this.icon,
    required this.activeIcon,
  });
}
